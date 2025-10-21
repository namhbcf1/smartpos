import { BaseService } from './BaseService';
import { Env } from '../types';

export class NotificationService extends BaseService {
  constructor(env: Env) {
    super(env, 'notifications', 'id');
  }
}
