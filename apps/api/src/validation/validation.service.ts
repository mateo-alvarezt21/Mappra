import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CheckAffiliationDto } from './dto/check-affiliation.dto';

/**
 * EPS Affiliation Validation Service
 *
 * Production integration path:
 * 1. Call ADRES (Administradora de los Recursos del SGSSS) REST API to get
 *    the authoritative affiliation status for a given document.
 *    Endpoint: POST https://www.adres.gov.co/api/afiliados/consulta
 *    Requires: entity NIT, bearer token from ADRES OAuth.
 * 2. Each EPS also exposes its own SOAP/REST WS for real-time validation
 *    (e.g. Sura, Sanitas, Nueva EPS all have documented webservices).
 * 3. The local `patients` table acts as a cache / last-known-state store
 *    that is refreshed after each successful external query.
 *
 * Until ADRES credentials are provisioned, the service falls back to the
 * internal DB (populated manually or via bulk import from ADRES CSV exports).
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async findAll() {
    const { data, error } = await this.db
      .from('eps_validations')
      .select(`
        *,
        patients(full_name, document_number),
        eps(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  }

  async check(dto: CheckAffiliationDto) {
    // 1. Query ADRES / EPS external API (production integration point)
    //    When ADRES_API_KEY is configured, call their REST service first
    //    and update the local cache with the authoritative response.
    const adresApiKey = process.env.ADRES_API_KEY;
    let adresResult: { status: string; affiliationType: string } | null = null;

    if (adresApiKey) {
      adresResult = await this.queryAdres(dto.document_type, dto.document_number, adresApiKey);
    } else {
      this.logger.debug(
        'ADRES_API_KEY not set — falling back to internal patient registry. ' +
        'Configure ADRES credentials to enable live EPS validation.',
      );
    }

    // 2. Look up the patient in the local registry (cache)
    const { data: patient } = await this.db
      .from('patients')
      .select('id, full_name, eps_id, affiliation_status, affiliation_type, eps(name)')
      .eq('document_number', dto.document_number)
      .eq('document_type', dto.document_type)
      .maybeSingle();

    // 3. Merge: ADRES result takes precedence when available
    const result_status = adresResult?.status ?? patient?.affiliation_status ?? 'Sin cobertura';
    const affiliation_type = adresResult?.affiliationType ?? patient?.affiliation_type ?? null;

    // 4. If ADRES returned a fresher status, sync back to the local cache
    if (adresResult && patient?.id) {
      await this.db
        .from('patients')
        .update({ affiliation_status: result_status, affiliation_type })
        .eq('id', patient.id);
    }

    // 5. Log the validation audit trail
    await this.db.from('eps_validations').insert({
      patient_id: patient?.id ?? null,
      eps_id: patient?.eps_id ?? null,
      result_status,
      affiliation_type,
    });

    // 6. Return clean result for the frontend
    return {
      found: !!patient,
      name: patient?.full_name ?? null,
      eps: (patient?.eps as any)?.name ?? null,
      affiliationType: affiliation_type,
      status: result_status,
      lastUpdate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      source: adresResult ? 'ADRES' : 'internal',
    };
  }

  /**
   * Calls the ADRES affiliation lookup API.
   * Replace the fetch URL and request shape once official credentials are issued.
   * ADRES documentation: https://www.adres.gov.co/desarrollo-y-operacion/servicios-de-informacion
   */
  private async queryAdres(
    documentType: string,
    documentNumber: string,
    apiKey: string,
  ): Promise<{ status: string; affiliationType: string } | null> {
    try {
      const res = await fetch('https://api.adres.gov.co/afiliados/v1/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ tipoDocumento: documentType, numeroDocumento: documentNumber }),
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return {
        status: data.estadoAfiliacion ?? 'Sin cobertura',
        affiliationType: data.tipoAfiliacion ?? null,
      };
    } catch (err) {
      this.logger.warn('ADRES API call failed, using internal registry', err);
      return null;
    }
  }
}
