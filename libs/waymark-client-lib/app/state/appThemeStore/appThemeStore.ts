import _ from 'lodash';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface EditorConfig {
  labels: {
    // TODO: we are going to remove this option once Spectrum has been migrated off of it
    exitEditor: string;
    // Labels for complete video confirmation modal that will pop up when the user clicks the "complete" button
    completeVideoConfirmation: {
      // Whether we should popup a confirmation modal when the user clicks the complete button
      shouldShow: boolean;
      // Labels for every part of the confirmation modal
      title: string;
      body: string;
      confirmButton: string;
      cancelButton: string;
    };
  };
  // TODO: we are going to remove this config option once Spectrum has been migrated off of it
  orientation: 'right' | 'left';
  // TODO: we are going to remove this config option
  personalization: {
    // Whether the editor should default to initially having the personalization panel open in the editor
    isDefault: boolean;
  };
}

interface ThemeConfig {
  themeClass?: string;
  editor: EditorConfig;
}

// Make a type that allows us to provide a partial config object to updateThemeConfig which
// can be merged into the full config object
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface AppThemeStore {
  themeConfig: ThemeConfig;
  actions: {
    /**
     * Takes a partial config object and merges it into the current config object.
     * Changes to the theme class will automatically be applied.
     *
     * @param {DeepPartial<ThemeConfig>} newThemeConfig - Partial config object to merge into the current config object
     */
    updateThemeConfig: (newThemeConfig: DeepPartial<ThemeConfig>) => void;
  };
}

export const defaultThemeConfig: ThemeConfig = {
  editor: {
    labels: {
      // Labels for complete video confirmation modal that will pop up when the user clicks the "complete" button
      completeVideoConfirmation: {
        // Whether we should popup a confirmation modal when the user clicks the complete button
        shouldShow: false,
        // Labels for every part of the confirmation modal
        title: 'Finalize Video',
        body: 'By finalizing this video, you confirm that you own the rights to all of its content.',
        confirmButton: 'Confirm',
        cancelButton: 'Cancel',
      },
      // TODO: we are going to remove this option once Spectrum has been migrated off of it
      exitEditor: 'Exit',
    },
    // TODO: we are going to remove this config option once Spectrum has been migrated off of it
    orientation: 'right',
    // TODO: we are going to remove this config option
    personalization: {
      // Whether the editor should default to initially having the personalization panel open in the editor
      isDefault: false,
    },
  },
};

export const useAppThemeStore = create(
  // Use subscribeWithSelector middleware so we can subscribe to changes to the theme class and
  // update the root element's class accordingly
  subscribeWithSelector<AppThemeStore>((set) => {
    // Apply the default theme class to the root element
    if (defaultThemeConfig.themeClass) {
      document.documentElement.classList.add(defaultThemeConfig.themeClass);
    }

    return {
      themeConfig: defaultThemeConfig,
      actions: {
        updateThemeConfig: (newThemeConfig) => {
          set((state) => {
            const updatedThemeConfig = _.cloneDeep(state.themeConfig);
            return {
              themeConfig: _.merge(updatedThemeConfig, newThemeConfig),
            };
          });
        },
      },
    };
  }),
);

// Update the class on the root <html> element when the theme class changes
// Note that this subscription won't run immediately when first added, only on
// subsequent changes. As a result, we need to manually apply the default theme
// when the store is first created.
useAppThemeStore.subscribe(
  (state) => state.themeConfig.themeClass,
  (themeClass, previousThemeClass) => {
    if (previousThemeClass) {
      document.documentElement.classList.remove(previousThemeClass);
    }
    if (themeClass) {
      document.documentElement.classList.add(themeClass);
    }
  },
);

export const updateAppThemeConfig = useAppThemeStore.getState().actions.updateThemeConfig;

// Hook returns the current theme config object
export const useAppThemeConfig = () => useAppThemeStore((state) => state.themeConfig);
