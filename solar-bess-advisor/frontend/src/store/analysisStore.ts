import { create } from 'zustand';
import type { ProjectInputs, AnalysisResult } from '../types/api';

const DEFAULT_INPUTS: ProjectInputs = {
  solar: {
    plant_capacity_mw: 500,
    cuf_percent: 22,
    ppa_tariff_inr: 2.5,
    clipping_loss_percent: 2.0,
    curtailment_percent: 1.0,
    dsm_penalty_percent: 1.5,
    solar_capex_cr: 1750,
    solar_om_cr_year: 8.75,
    solar_degradation_percent: 0.5,
    project_life_years: 25,
    wacc_percent: 10,
    tax_rate_percent: 25.17,
  },
  bess: {
    bess_capacity_mwh: 250,
    bess_power_mw: 100,
    bess_capex_cr: 150,
    bess_om_cr_year: 1.5,
    rte_percent: 88,
    battery_degradation_percent: 2.0,
    cycles_per_day: 1.0,
    replacement_year: null,
    replacement_cost_cr: null,
  },
  revenue: {
    off_peak_buy_tariff_inr: 0,
    peak_sell_tariff_inr: 3.3,
    curtailment_sell_tariff_inr: 3.3,
    clipping_sell_tariff_inr: 3.3,
    clipping_recovery_factor: 0.85,
    curtailment_recovery_factor: 0.80,
    ancillary_enabled: false,
    ancillary_rate_cr_mw_year: 0.5,
    ancillary_capacity_mw: 20,
    om_escalation_percent: 3.0,
  },
};

interface AnalysisStore {
  inputs: ProjectInputs;
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  projectName: string;
  activeTab: 'inputs' | 'results';
  inputStep: 0 | 1 | 2;
  resultsSection: 'dashboard' | 'cashflows' | 'sensitivity' | 'advisory';

  setInputs: (inputs: ProjectInputs) => void;
  setSolarInput: <K extends keyof ProjectInputs['solar']>(key: K, value: ProjectInputs['solar'][K]) => void;
  setBessInput: <K extends keyof ProjectInputs['bess']>(key: K, value: ProjectInputs['bess'][K]) => void;
  setRevenueInput: <K extends keyof ProjectInputs['revenue']>(key: K, value: ProjectInputs['revenue'][K]) => void;
  setResult: (result: AnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectName: (name: string) => void;
  setActiveTab: (tab: 'inputs' | 'results') => void;
  setInputStep: (step: 0 | 1 | 2) => void;
  setResultsSection: (section: 'dashboard' | 'cashflows' | 'sensitivity' | 'advisory') => void;
  resetInputs: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  inputs: DEFAULT_INPUTS,
  result: null,
  loading: false,
  error: null,
  projectName: 'Rajasthan 500 MW Solar + BESS',
  activeTab: 'inputs',
  inputStep: 0,
  resultsSection: 'dashboard',

  setInputs: (inputs) => set({ inputs }),

  setSolarInput: (key, value) =>
    set((state) => ({
      inputs: { ...state.inputs, solar: { ...state.inputs.solar, [key]: value } },
    })),

  setBessInput: (key, value) =>
    set((state) => ({
      inputs: { ...state.inputs, bess: { ...state.inputs.bess, [key]: value } },
    })),

  setRevenueInput: (key, value) =>
    set((state) => ({
      inputs: { ...state.inputs, revenue: { ...state.inputs.revenue, [key]: value } },
    })),

  setResult: (result) => set({ result, activeTab: result ? 'results' : 'inputs', resultsSection: 'dashboard' }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProjectName: (projectName) => set({ projectName }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setInputStep: (inputStep) => set({ inputStep }),
  setResultsSection: (resultsSection) => set({ resultsSection }),
  resetInputs: () => set({ inputs: DEFAULT_INPUTS, result: null, error: null, resultsSection: 'dashboard' }),
}));
