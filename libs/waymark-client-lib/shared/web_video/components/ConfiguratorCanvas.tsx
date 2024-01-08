import { useEffect, useRef } from 'react';

// Local Imports
import WaymarkAuthorConfigurator from '../configurator/WaymarkAuthorConfigurator';

import * as styles from './ConfiguratorCanvas.css';

interface ConfiguratorReplicationProps {
  configurator: WaymarkAuthorConfigurator;
  id?: string;
}

/**
 * This is a component intended to mirror a rendering
 * Configurator. That is, if you pass it a Configurator, this
 * component will replicate whatever is being drawn by the Configurator
 * into this component's own canvas.
 *
 * @param  {object}     props
 * @param  {class}      props.configurator    - The configurator to replicate onto the canvas.
 * @param  {boolean}    props.isFullscreen    - If the replicator is shown fullscreen, different styles need to be used to stretch the canvas.
 */
export default function ConfiguratorCanvas({ configurator, id }: ConfiguratorReplicationProps) {
  const canvasParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvasParent = canvasParentRef.current;
    if (!canvasParent || !configurator || !configurator.canvasElement) {
      return;
    }
    canvasParent.replaceChildren(configurator.canvasElement);
  }, [configurator]);

  return <div ref={canvasParentRef} className={styles.CanvasParent} id={id}></div>;
}
