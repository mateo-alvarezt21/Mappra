import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { ValidationModule } from './validation/validation.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChannelsModule } from './channels/channels.module';
import { DoctorsModule } from './doctors/doctors.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AppointmentsModule,
    PatientsModule,
    ValidationModule,
    AnalyticsModule,
    ChannelsModule,
    DoctorsModule,
    UsersModule,
  ],
})
export class AppModule {}
