export const BASE_WHITE_LABELED_URL = 'video-preview.com';
export const BASE_BRANDED_URL = 'waymark.com';

export const renderStatuses = {
    initial: 'initial',
    inProgress: 'in_progress',
    succeeded: 'succeeded',
    failed: 'failed',
    aborted: 'aborted',
};

export const renderFormats = {
    standardQuality: 'email',
    highQuality: 'broadcast_quality',
    voiceOver: 'voiceover',
};

export const voiceOverStyleOptions = [{
        name: 'Professional',
        value: 'professional',
    },
    {
        name: 'Conversational',
        value: 'conversational',
    },
    {
        name: 'Calming',
        value: 'calming',
    },
    {
        name: 'Friendly',
        value: 'friendly',
    },
    {
        name: 'Energetic',
        value: 'energetic',
    },
    {
        name: 'Serious',
        value: 'serious',
    },
];

export const voiceOverTimbreOptions = [{
        name: 'Masculine',
        value: 'masculine',
    },
    {
        name: 'Feminine',
        value: 'feminine',
    },
    {
        name: 'No preference',
        value: 'no_preference',
    },
];