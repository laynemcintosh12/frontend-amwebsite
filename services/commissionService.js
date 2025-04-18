const { differenceInMonths } = require('date-fns');

// Calculate commission for a single customer
const calculateCommission = async (user, customer, team) => {
  const { role, hire_date } = user;
  const { lead_source, initial_scope_price, total_job_price, referrer_id } = customer;

  // Validate and default fields
  const validHireDate = hire_date ? new Date(hire_date) : new Date(); // Default to current date if hire_date is missing
  const tenureMonths = differenceInMonths(new Date(), validHireDate);

  const validInitialScopePrice = initial_scope_price || 0; // Default to 0 if null or undefined
  const validTotalJobPrice = total_job_price || 0; // Default to 0 if null or undefined
  const validMarginAdded = validTotalJobPrice - validInitialScopePrice || 0; // Default to 0 if null or undefined

  let commission = 0;

  if (role === 'Affiliate Marketer') {
    commission = Math.min(0.05 * validTotalJobPrice, 750);
  } else if (role === 'Salesman') {
    commission = calculateSalesmanCommission(tenureMonths, lead_source, validInitialScopePrice, validTotalJobPrice);
  } else if (role === 'Sales Manager') {
    commission = calculateSalesManagerCommission(lead_source, validInitialScopePrice, validTotalJobPrice, tenureMonths, team);
  } else if (role === 'Supplement Manager') {
    const marginAdded = validTotalJobPrice - validInitialScopePrice;
    commission = calculateSupplementManagerCommission(marginAdded, team);
  } else if (role === 'Supplementer') {
    commission = Math.max(0.07 * validMarginAdded, 300);
  }

  return commission;
};

// Salesman commission logic
const calculateSalesmanCommission = (tenureMonths, lead_source, initial_scope_price, total_job_price) => {
  let commission = 0;
  const margin = total_job_price - initial_scope_price;

  if (tenureMonths <= 6) {
    if (['Canvassing - Salesman', 'Referral'].includes(lead_source)) {
      commission = 0.1 * initial_scope_price + 0.04 * margin;
    } else if (lead_source === 'Affiliate') {
      commission = 0.06 * initial_scope_price + 0.04 * margin;
    } else if (lead_source === 'Canvassing - Company') {
      commission = 0.08 * initial_scope_price + 0.04 * margin - 300;
    } else {
      commission = 0.08 * initial_scope_price + 0.04 * margin;
    }
  } else if (tenureMonths <= 12) {
    commission = 0.02 * initial_scope_price + 0.04 * margin;
    if (['Canvassing - Salesman', 'Referral'].includes(lead_source)) {
      commission += 0.01 * initial_scope_price;
    }
  } else {
    commission = 0.04 * initial_scope_price + 0.04 * margin;
  }

  return commission;
};

// Sales Manager commission logic
const calculateSalesManagerCommission = (lead_source, initial_scope_price, total_job_price, tenureMonths, team) => {
  let commission = 0;

  if (['Canvassing - Salesman', 'Referral'].includes(lead_source)) {
    commission = 0.15 * total_job_price;
  } else if (lead_source === 'Affiliate') {
    commission = 0.1 * total_job_price;
  } else if (lead_source === 'Canvassing - Company') {
    commission = 0.12 * total_job_price - 300;
  } else {
    commission = 0.12 * total_job_price;
  }

  // Add overrides for team members
  if (team) {
    team.salesman_ids.forEach((salesmanId) => {
      if (tenureMonths <= 6) {
        commission += 0.04 * total_job_price;
      } else if (tenureMonths <= 12) {
        commission += 0.02 * total_job_price;
      }
    });
  }

  return commission;
};

// Supplement Manager commission logic
const calculateSupplementManagerCommission = (marginAdded, team) => {
  let commission = Math.max(0.1 * marginAdded, 500);

  // Add overrides for team supplementers
  if (team && team.supplementer_ids) {
    team.supplementer_ids.forEach(() => {
      commission += Math.max(0.03 * marginAdded, 200);
    });
  }

  return commission;
};


module.exports = { calculateCommission };