export enum AudioSources {
  Upload = 'upload',
  Generated = 'generated',
  Stock = 'stock',
}

export interface AccountAudioAsset {
  uploadKey: string;
  previewURL?: string;
  length: number;
  displayName: string;
  source: `${AudioSources}`;
}
