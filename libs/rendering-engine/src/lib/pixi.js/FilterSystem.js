/* eslint-disable */

/**
 * Filter System overridden to add additional padding around a filter when fit to the inside of the canvas.
 *
 * The ultimate goal is to eventually remove this by finding a more localized workaround (the frame padding workaround).
 *
 */

export default function enableDisplayObjectProperties(pixiNamespace) {
    const FilterState = pixiNamespace.FilterState;
    pixiNamespace.systems.FilterSystem.AUTO_FIT_BOUNDS_PADDING = 50;

    /**
     * @dangerousMonkeyPatch
     */
    pixiNamespace.systems.FilterSystem.prototype.push = function push(target, filters) {
        const renderer = this.renderer;
        const filterStack = this.defaultFilterStack;
        const state = this.statePool.pop() || new FilterState();
        const renderTextureSystem = this.renderer.renderTexture;

        let resolution = filters[0].resolution;
        let multisample = filters[0].multisample;
        let padding = filters[0].padding;
        let autoFit = filters[0].autoFit;
        // We don't know whether it's a legacy filter until it was bound for the first time,
        // therefore we have to assume that it is if legacy is undefined.
        let legacy = filters[0].legacy ? ? true;

        for (let i = 1; i < filters.length; i++) {
            const filter = filters[i];

            // let's use the lowest resolution
            resolution = Math.min(resolution, filter.resolution);
            // let's use the lowest number of samples
            multisample = Math.min(multisample, filter.multisample);
            // figure out the padding required for filters
            padding = this.useMaxPadding ? // old behavior: use largest amount of padding!
                Math.max(padding, filter.padding) : // new behavior: sum the padding
                padding + filter.padding;
            // only auto fit if all filters are autofit
            autoFit = autoFit && filter.autoFit;

            legacy = legacy || (filter.legacy ? ? true);
        }

        if (filterStack.length === 1) {
            this.defaultFilterStack[0].renderTexture = renderTextureSystem.current;
        }

        filterStack.push(state);

        state.resolution = resolution;
        state.multisample = multisample;

        state.legacy = legacy;

        state.target = target;
        state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));

        state.sourceFrame.pad(padding);

        const sourceFrameProjected = this.tempRect.copyFrom(renderTextureSystem.sourceFrame);
        // Project source frame into world space (if projection is applied)
        if (renderer.projection.transform) {
            this.transformAABB(
                tempMatrix.copyFrom(renderer.projection.transform).invert(),
                sourceFrameProjected,
            );
        }

        if (autoFit) {
            // WM: Begin monkeypatch
            // NOTE: We have an outstanding (if we do say so ourselves) question regarding
            // why `padding` isn't used for `sourceFrameProjected`. Notice that `padding` is applied on
            // :62. But ultimately in the case of motion blur, we have a problem around the edges of the canvas
            // where black pixels are "blurred" on the edge because sourceFrameProjected/renderTextureSystem.sourceFrame
            // does not have any padding applied to it.
            //
            // We have a theory of how to fix this without monkeypatching. Take a look at these bug reports and docs:
            // - https://github.com/pixijs/pixijs/issues/5969
            // - https://www.html5gamedevs.com/topic/48431-problem-with-bulgepinchfilter-and-off-screen-graphics/
            // - https://github.com/pixijs/pixijs/wiki/v5-Creating-filters
            //
            // It stands to reason, that we could do something along the lines of turning autoFit off for the MotionBlur3DFilter
            // and then adding the necessary padding to the `.filterArea` property on the relevant DisplayObject.
            sourceFrameProjected.pad(pixiNamespace.systems.FilterSystem.AUTO_FIT_BOUNDS_PADDING);
            // WM: End monkeypatch
            state.sourceFrame.fit(sourceFrameProjected);

            if (state.sourceFrame.width <= 0 || state.sourceFrame.height <= 0) {
                state.sourceFrame.width = 0;
                state.sourceFrame.height = 0;
            }
        } else if (!state.sourceFrame.intersects(sourceFrameProjected)) {
            state.sourceFrame.width = 0;
            state.sourceFrame.height = 0;
        }

        // Round sourceFrame in screen space based on render-texture.
        this.roundFrame(
            state.sourceFrame,
            renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution,
            renderTextureSystem.sourceFrame,
            renderTextureSystem.destinationFrame,
            renderer.projection.transform,
        );

        state.renderTexture = this.getOptimalFilterTexture(
            state.sourceFrame.width,
            state.sourceFrame.height,
            resolution,
            multisample,
        );
        state.filters = filters;

        state.destinationFrame.width = state.renderTexture.width;
        state.destinationFrame.height = state.renderTexture.height;

        const destinationFrame = this.tempRect;

        destinationFrame.x = 0;
        destinationFrame.y = 0;
        destinationFrame.width = state.sourceFrame.width;
        destinationFrame.height = state.sourceFrame.height;

        state.renderTexture.filterFrame = state.sourceFrame;
        state.bindingSourceFrame.copyFrom(renderTextureSystem.sourceFrame);
        state.bindingDestinationFrame.copyFrom(renderTextureSystem.destinationFrame);

        state.transform = renderer.projection.transform;
        renderer.projection.transform = null;
        renderTextureSystem.bind(state.renderTexture, state.sourceFrame, destinationFrame);
        renderer.framebuffer.clear(0, 0, 0, 0);
    };
}

/* eslint-enable */