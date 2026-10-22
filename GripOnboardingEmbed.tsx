import React, { useEffect, useRef } from 'react';
import { GripUser } from '../types/grip';
import { storage } from '../services/storage';

interface GripOnboardingEmbedProps {
  onComplete: (user?: GripUser) => void;
  isDarkMode?: boolean;
}

export const GripOnboardingEmbed: React.FC<GripOnboardingEmbedProps> = ({
  onComplete,
  isDarkMode,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'grip:onboarding-done' || (e.data && e.data.type === 'grip:onboarding-done')) {
        try {
          localStorage.setItem('grip_onboarding_seen', '1');
        } catch (_) {}
        onComplete();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const win = iframe.contentWindow as any;

      if (doc && isDarkMode !== undefined) {
        doc.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      }

      if (win) {
        // Callback defined in grip-onboarding.html:
        // if(typeof window.onGripOnboardingDone==='function')window.onGripOnboardingDone();
        win.onGripOnboardingDone = () => {
          try {
            localStorage.setItem('grip_onboarding_seen', '1');
          } catch (_) {}
          onComplete();
        };
      }

      if (doc) {
        // Event 1: grip:onboarding-done
        doc.addEventListener('grip:onboarding-done', () => {
          try {
            localStorage.setItem('grip_onboarding_seen', '1');
          } catch (_) {}
          onComplete();
        });

        // Event 2: grip:google-signin
        doc.addEventListener('grip:google-signin', (e: any) => {
          if (e.preventDefault) e.preventDefault();

          // Create authenticated Google user session
          const currentUser: GripUser = {
            id: 'google_user_' + Date.now(),
            name: 'مستخدم Grip',
            email: '',
            isDeveloper: import.meta.env.DEV,
            isGoogleUser: false,
            authProvider: 'guest',
            joinedAt: new Date().toISOString(),
          };
          storage.saveUser(currentUser);

          try {
            localStorage.setItem('grip_onboarding_seen', '1');
          } catch (_) {}

          if (e.detail && typeof e.detail.success === 'function') {
            e.detail.success();
          }

          setTimeout(() => {
            onComplete(currentUser);
          }, 350);
        });
      }
    } catch (err) {
      console.warn('Cross-frame setup warning in GripOnboardingEmbed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-full z-[2147483000] bg-[#F8F9FA] dark:bg-[#0F1117] select-none"
      style={{ isolation: 'isolate' }}
    >
      <iframe
        ref={iframeRef}
        src="/grip-onboarding.html"
        title="Grip Onboarding"
        onLoad={handleIframeLoad}
        className="w-full h-full border-0 block"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: isDarkMode ? '#0F1117' : '#F8F9FA',
        }}
        allow="autoplay"
      />
    </div>
  );
};
