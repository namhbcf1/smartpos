// api folder will be removed after migration
import health from './system/health';
import openapi from './system/openapi';
import diagnostics from './system/diagnostics';

// New modular aggregators (domain-based)
import catalog from './catalog/index';
import orders from './orders/index';
import inventory from './inventory/index';
import financials from './financials/index';
import usersModule from './users-module/index';
import promos from './promos/index';
import integrations from './integrations/index';
import customers from './customers/index';
import devicesModule from './devices/index';
import r2 from './r2/index';
import realtime from './realtime/index';

// Individual feature modules
import discounts from './discounts/index';
import promotions from './promotions/index';
import taxes from './taxes/index';
import invoices from './invoices/index';
import analytics from './analytics/index';
import employees from './employees/index';
import roles from './roles/index';
import debts from './debts/index';
import warranty from './warranty/index';
import support from './support/index';
import reports from './reports/index';

// Existing grouped routers kept for backward compatibility
import alerts from './alerts/index';
import financial from './financial/index';
import payments from './payments/index';
import shipping from './shipping/index';
import suppliers from './suppliers/index';
import users from './users/index';
import returns from './returns/index';
import pos from './pos/index';

// API aggregator
import api from './api/index';

export default {
  // API aggregator
  api,

  // System routes
  system: {
    health,
    openapi,
    diagnostics,
  },

  // Domain-based modules (preferred structure)
  catalog,
  orders,
  customers,
  inventory,
  financials,
  usersModule,
  promos,
  integrations,
  devices: devicesModule,
  r2,
  realtime,

  // Individual feature modules
  discounts,
  promotions,
  taxes,
  invoices,
  analytics,
  employees,
  roles,
  debts,
  warranty,
  support,
  reports,

  // Backward compatibility routes
  alerts,
  financial,
  payments,
  shipping,
  suppliers,
  users,
  returns,
  pos,
};

