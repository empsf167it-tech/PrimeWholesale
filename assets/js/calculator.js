/* ==========================================================================
   PRIME WHOLESALE MEATS — calculator.js
   Client-side Bulk Order & Cold-Chain Shipping Estimator Engine.
   Calculates wholesale meat volume tiers, packaging fees, & freight costs.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const money2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

  // Base Wholesale Price Matrix per KG ($ USD)
  const PROTEIN_PRICES = {
    beef: 14.50,     // Prime Wagyu & Angus Beef
    pork: 8.80,      // Heritage Pork
    mutton: 13.20,   // Farm Mutton & Lamb
    chicken: 4.60,   // Free-Range Chicken
    fish: 16.00,     // Ocean Fresh Salmon & Fish
    rabbit: 15.50    // Farm Dressed Rabbit
  };

  // Packaging Fee per KG
  const PACKAGING_RATES = {
    vacuum: 0.30,   // Vacuum Sealed Packs
    chilled: 0.25,  // Chilled Fresh Container
    frozen: 0.45    // Deep Frozen (-18°C) Block
  };

  // Freight Rate per KG
  const FREIGHT_RATES = {
    truck: 0.80,    // Standard Refrigerated Truck
    express: 1.50,  // Express Cold Chain Logistics
    air: 2.80       // Air Cargo Refrigerated
  };

  function calculateVolumeDiscount(weightKg) {
    if (weightKg >= 1000) return 0.20; // 20% savings for 1T+
    if (weightKg >= 500)  return 0.12; // 12% savings for 500kg+
    if (weightKg >= 100)  return 0.05; // 5% savings for 100kg+
    return 0.0;
  }

  function parseNumber(value) {
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  /* ------------------------------------------------------------------
     1. Homepage Quick Quote Widget
     ------------------------------------------------------------------ */
  function initQuickQuote() {
    const widget = $('#quickQuote');
    if (!widget) return;

    const proteinSelect = $('#qqProtein');
    const weightInput = $('#qqWeight');
    const outputEl = $('#qqTotal');
    const linkEl = $('#qqLink');

    function update() {
      const protein = proteinSelect ? proteinSelect.value : 'beef';
      const weight = parseNumber(weightInput.value) || 100;
      const basePrice = PROTEIN_PRICES[protein] || 14.50;
      const discount = calculateVolumeDiscount(weight);
      const subtotal = weight * basePrice * (1 - discount);

      if (outputEl) outputEl.textContent = money0.format(subtotal);
      if (linkEl) {
        linkEl.href = 'calculator.html?protein=' + protein + '&weight=' + weight;
      }
    }

    if (proteinSelect) proteinSelect.addEventListener('change', update);
    if (weightInput) weightInput.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------
     2. Full Wholesale Calculator Page
     ------------------------------------------------------------------ */
  function initFullCalculator() {
    const calc = $('#fullCalculator');
    if (!calc) return;

    const proteinInput = $('#calcProtein');
    const weightSlider = $('#calcWeightSlider');
    const weightInput = $('#calcWeightInput');
    const packagingInput = $('#calcPackaging');
    const freightInput = $('#calcFreight');

    // Outputs
    const subtotalOut = $('#outSubtotal');
    const discountRateOut = $('#outDiscountRate');
    const discountAmountOut = $('#outDiscountAmount');
    const packagingOut = $('#outPackaging');
    const freightOut = $('#outFreight');
    const totalOut = $('#outTotalTotal');
    const pricePerKgOut = $('#outEffectivePrice');
    const printBtn = $('#printQuoteBtn');

    // Preset Params from URL query
    const params = new URLSearchParams(window.location.search);
    if (params.has('protein') && proteinInput) {
      proteinInput.value = params.get('protein');
    }
    if (params.has('weight')) {
      const w = parseNumber(params.get('weight'));
      if (w > 0) {
        if (weightSlider) weightSlider.value = w;
        if (weightInput) weightInput.value = w;
      }
    }

    function syncWeight(source) {
      if (source === 'slider' && weightInput && weightSlider) {
        weightInput.value = weightSlider.value;
      } else if (source === 'input' && weightSlider && weightInput) {
        weightSlider.value = weightInput.value;
      }
      update();
    }

    function update() {
      const protein = proteinInput ? proteinInput.value : 'beef';
      const weight = Math.max(10, parseNumber(weightInput ? weightInput.value : 100));
      const packType = packagingInput ? packagingInput.value : 'vacuum';
      const freightType = freightInput ? freightInput.value : 'truck';

      const basePrice = PROTEIN_PRICES[protein] || 14.50;
      const discountPct = calculateVolumeDiscount(weight);
      const rawMeatTotal = weight * basePrice;
      const discountAmount = rawMeatTotal * discountPct;
      const netMeatTotal = rawMeatTotal - discountAmount;

      const packFee = weight * (PACKAGING_RATES[packType] || 0.30);
      const freightFee = weight * (FREIGHT_RATES[freightType] || 0.80);

      const grandTotal = netMeatTotal + packFee + freightFee;
      const effectivePricePerKg = grandTotal / weight;

      if (subtotalOut) subtotalOut.textContent = money2.format(rawMeatTotal);
      if (discountRateOut) discountRateOut.textContent = (discountPct * 100) + '% Off';
      if (discountAmountOut) discountAmountOut.textContent = '-' + money2.format(discountAmount);
      if (packagingOut) packagingOut.textContent = money2.format(packFee);
      if (freightOut) freightOut.textContent = money2.format(freightFee);
      if (totalOut) totalOut.textContent = money2.format(grandTotal);
      if (pricePerKgOut) pricePerKgOut.textContent = money2.format(effectivePricePerKg) + ' / kg';
    }

    if (weightSlider) weightSlider.addEventListener('input', () => syncWeight('slider'));
    if (weightInput) weightInput.addEventListener('input', () => syncWeight('input'));
    if (proteinInput) proteinInput.addEventListener('change', update);
    if (packagingInput) packagingInput.addEventListener('change', update);
    if (freightInput) freightInput.addEventListener('change', update);

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    update();
  }

  /* ------------------------------------------------------------------
     Boot Calculator Engine
     ------------------------------------------------------------------ */
  function boot() {
    initQuickQuote();
    initFullCalculator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
