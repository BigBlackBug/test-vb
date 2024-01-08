/**
 * One-half of our home-baked runtime configuration manager. The global `__RUNTIME_CONFIG__`
 * object is constructed via `site_base.jinja` or `site_base_v2.jinja`. This
 * RuntimeConfig helper offers a simple interface for accessing the configuration
 * for a specific file path.
 */
class RuntimeConfig {
    constructor(initialConfig = {}) {
        this.config = {};
        Object.assign(this.config, initialConfig);
    }

    getConfig(namespace) {
        return this.config[namespace] || {};
    }
}

// The following line needs to be ignored so that we can use __RUNTIME_CONFIG__
// without the 'unexpected dangling _' linting rule.
// eslint-disable-next-line
export default new RuntimeConfig(typeof window === 'undefined' ? {} : window.__RUNTIME_CONFIG__);