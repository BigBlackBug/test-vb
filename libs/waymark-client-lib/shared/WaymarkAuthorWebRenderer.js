/** Singleton for importing `waymark-author-web-renderer` related packages within ivory */
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import WaymarkAuthorWebRenderer from '@libs/rendering-engine';

import {
    parseQueryParams
} from 'shared/utils/urls.js';
import settings from 'shared/utils/settings.js';

// Set environment variables for renderer before exporting
WaymarkAuthorWebRenderer.settings.WAYMARK_ENVIRONMENT = settings.APP_ENVIRONMENT;
WaymarkAuthorWebRenderer.settings.APS_ASSET_HOST = settings.APS_ASSET_HOST;

/**
 * You can emulate the response of `WaymarkAuthorWebRenderer.analyzeSupport()` by using the
 * query parameter "fakedRendererSupport" and setting a valid value of (-1, 0, 10).
 *
 * These values map to the possible WaymarkAuthorWebRenderer.SUPPORT values:
 * - WaymarkAuthorWebRenderer.SUPPORT.UNSUPPORTED === -1
 * - WaymarkAuthorWebRenderer.SUPPORT.REDUCED_PERFORMANCE === 0
 * - WaymarkAuthorWebRenderer.SUPPORT.FULLY_SUPPORTED === 10
 *
 * In Chrome, you can actually force a value of 0 by going to `chrome://settings/system` and turning
 * "Use hardware acceleration when available" off.
 */
const urlParams = parseQueryParams();
if (urlParams.fakedRendererSupport !== undefined) {
    const fakedRendererSupport = parseInt(urlParams.fakedRendererSupport, 10);
    const possibleSupportValues = Object.values(WaymarkAuthorWebRenderer.SUPPORT);
    if (possibleSupportValues.includes(fakedRendererSupport)) {
        // eslint-disable-next-line no-console
        console.info(
            `Emulating WaymarkAuthorWebRenderer.anaylzeSupport() to return ${fakedRendererSupport}`,
        );
        WaymarkAuthorWebRenderer.analyzeSupport = () => fakedRendererSupport;
    } else {
        console.warn(
            `Url parameter 'fakedRendererSupport' was supplied an invalid value of '${fakedRendererSupport}', must be one of the following: ${possibleSupportValues}`,
        );
    }
}

// Pass through all named exports from the renderer
export * from '@libs/rendering-engine';

// TODO: Fix this waymark-client-lib shared renderer settings madness. This is a hotfix.
// We are exported our initial settings here. The WaymarkAuthorWebRenderer still has a `defaultSettings`
// export, but its values for things like WAYMARK_ENVIRONMENT and WAYMARK_APS_ASSET_HOST will differ
// because they're set in this file. We need to fix this spaghetti.
export const initialSettings = _.cloneDeep(WaymarkAuthorWebRenderer.settings);

// Keep the web renderer itself as the default export
export default WaymarkAuthorWebRenderer;