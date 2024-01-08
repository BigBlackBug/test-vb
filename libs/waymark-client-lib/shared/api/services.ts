// Local
import { WaymarkServiceAccessKey } from 'libs/shared-types';
import baseAPI from 'shared/api/core/base.js';

/**
 * Fetch resources from the AudioProcessingService discovery endpoint
 */
export const fetchAudioProcessingServiceResources = () =>
  baseAPI.get('audio-processing-service-discovery/');

/**
 * Fetch a WaymarkIdentity and service discovery configuration from the Ivory endpoint.
 */
export const fetchServiceAccess = (): Promise<WaymarkServiceAccessKey> =>
  baseAPI.get('service-access/');
