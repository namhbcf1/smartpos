import api from './api/index';
import health from './system/health';
import openapi from './system/openapi';
import diagnostics from './system/diagnostics';
import alerts from './alerts';
import financial from './financial';
import payments from './payments';
import shipping from './shipping';
import suppliers from './suppliers';
import users from './users';
import returns from './returns';

export default {
  api,
  system: {
    health,
    openapi,
    diagnostics,
  },
  alerts,
  financial,
  payments,
  shipping,
  suppliers,
  users,
  returns,
};


