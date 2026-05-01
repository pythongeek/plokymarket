"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'deposit'
  | 'kyc'
  | 'first-trade'
  | 'complete';

export interface OnboardingData {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  profileComplete: boolean;
  depositMade: boolean;
  kycVerified: boolean;
  firstTradeMade: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseOnboardingReturn extends OnboardingData {
  setStep: (step: OnboardingStep) => Promise<void>;
  completeStep: (step: OnboardingStep) => Promise<void>;
  skipStep: (step: OnboardingStep) => Promise<void>;
  nextStep: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isStepCompleted: (step: OnboardingStep) => boolean;
  isStepSkipped: (step: OnboardingStep) => boolean;
  progress: number;
}

const STORAGE_KEY = 'plokymarket_onboarding_state';
const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'profile',
  'deposit',
  'kyc',
  'first-trade',
  'complete',
];

const STEP_WEIGHTS: Record<OnboardingStep, number> = {
  'welcome': 10,
  'profile': 20,
  'deposit': 25,
  'kyc': 25,
  'first-trade': 15,
  'complete': 5,
};

function loadOnboardingState(): Partial<OnboardingData> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveOnboardingState(state: Partial<OnboardingData>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save onboarding state:', e);
  }
}

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingData>({
    currentStep: 'welcome',
    completedSteps: [],
    profileComplete: false,
    depositMade: false,
    kycVerified: false,
    firstTradeMade: false,
    isLoading: true,
    error: null,
  });

  // Load saved state on mount
  useEffect(() => {
    const saved = loadOnboardingState();
    setState(prev => ({
      ...prev,
      currentStep: saved.currentStep || 'welcome',
      completedSteps: saved.completedSteps || [],
      profileComplete: saved.profileComplete || false,
      depositMade: saved.depositMade || false,
      kycVerified: saved.kycVerified || false,
      firstTradeMade: saved.firstTradeMade || false,
      isLoading: false,
    }));
  }, []);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (!state.isLoading) {
      saveOnboardingState({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        profileComplete: state.profileComplete,
        depositMade: state.depositMade,
        kycVerified: state.kycVerified,
        firstTradeMade: state.firstTradeMade,
      });
    }
  }, [state]);

  // Verify actual backend state (profile, kyc, etc.)
  useEffect(() => {
    const verifyBackendState = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) return;

      try {
        // Check profile completeness
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name, avatar_url, phone')
          .eq('id', session.user.id)
          .single();

        const profileComplete = !!(profile?.name && profile?.phone);

        // Check KYC status
        const { data: kycData } = await supabase
          .from('kyc_verifications')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('status', 'verified')
          .single();

        const kycVerified = !!kycData;

        // Check if user has made a trade
        const { count: tradeCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .limit(1);

        const firstTradeMade = (tradeCount ?? 0) > 0;

        // Check if user has made a deposit
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();

        const depositMade = !!(wallet && Number(wallet.balance) > 0);

        setState(prev => ({
          ...prev,
          profileComplete,
          kycVerified,
          firstTradeMade,
          depositMade,
        }));
      } catch (err) {
        console.warn('Failed to verify backend onboarding state:', err);
      }
    };

    verifyBackendState();
  }, []);

  const setStep = useCallback(async (step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const completeStep = useCallback(async (step: OnboardingStep) => {
    setState(prev => {
      const completedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step];

      let nextStep = prev.currentStep;
      if (step === prev.currentStep) {
        const currentIndex = ONBOARDING_STEPS.indexOf(step);
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
          nextStep = ONBOARDING_STEPS[currentIndex + 1];
        }
      }

      return {
        ...prev,
        completedSteps,
        currentStep: nextStep,
        profileComplete: step === 'profile' ? true : prev.profileComplete,
        depositMade: step === 'deposit' ? true : prev.depositMade,
        kycVerified: step === 'kyc' ? true : prev.kycVerified,
        firstTradeMade: step === 'first-trade' ? true : prev.firstTradeMade,
      };
    });
  }, []);

  const skipStep = useCallback(async (step: OnboardingStep) => {
    setState(prev => {
      const completedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step];

      const currentIndex = ONBOARDING_STEPS.indexOf(step);
      const nextStep = currentIndex < ONBOARDING_STEPS.length - 1
        ? ONBOARDING_STEPS[currentIndex + 1]
        : 'complete';

      return {
        ...prev,
        completedSteps,
        currentStep: nextStep,
      };
    });
  }, []);

  const nextStep = useCallback(async () => {
    setState(prev => {
      const currentIndex = ONBOARDING_STEPS.indexOf(prev.currentStep);
      const nextStep = currentIndex < ONBOARDING_STEPS.length - 1
        ? ONBOARDING_STEPS[currentIndex + 1]
        : 'complete';

      return {
        ...prev,
        currentStep: nextStep,
      };
    });
  }, []);

  const resetOnboarding = useCallback(async () => {
    setState({
      currentStep: 'welcome',
      completedSteps: [],
      profileComplete: false,
      depositMade: false,
      kycVerified: false,
      firstTradeMade: false,
      isLoading: false,
      error: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isStepCompleted = useCallback((step: OnboardingStep) => {
    return state.completedSteps.includes(step);
  }, [state.completedSteps]);

  const isStepSkipped = useCallback((step: OnboardingStep) => {
    // For now, consider all non-essential steps as skippable
    return ['kyc', 'first-trade'].includes(step) && !state.completedSteps.includes(step);
  }, [state.completedSteps]);

  const progress = ONBOARDING_STEPS.slice(0, -1).reduce((acc, step) => {
    if (state.completedSteps.includes(step)) {
      return acc + STEP_WEIGHTS[step];
    }
    return acc;
  }, 0);

  return {
    ...state,
    setStep,
    completeStep,
    skipStep,
    nextStep,
    resetOnboarding,
    isStepCompleted,
    isStepSkipped,
    progress,
  };
}
