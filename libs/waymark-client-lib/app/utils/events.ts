import { UnformattedConfiguredVideo } from 'shared/api/types';

export const fanoutVideoRenderCompletedEvent = {
  eventName: 'wm:fanoutVideoRenderCompleted',
  emit(configuredVideo: UnformattedConfiguredVideo) {
    document.dispatchEvent(
      new CustomEvent(this.eventName, {
        detail: configuredVideo,
      }),
    );
  },
  subscribe(callback: (configuredVideo: UnformattedConfiguredVideo) => void) {
    const listener = (event: CustomEvent<UnformattedConfiguredVideo>) => callback(event.detail);
    document.addEventListener(this.eventName, listener as EventListener);
    // Return an unsubscribe callback
    return () => document.removeEventListener(this.eventName, listener as EventListener);
  },
};
