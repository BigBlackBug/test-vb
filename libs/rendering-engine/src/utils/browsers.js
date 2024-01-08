import {
    detect
} from 'detect-browser';

export function getBrowserInfo() {
    const browserInfo = detect();
    let browserOS;
    let browserName;
    // On node platforms browserInfo will return back null
    if (browserInfo) {
        ({
            os: browserOS,
            name: browserName
        } = browserInfo);
    }

    return {
        browserOS,
        browserName,
    };
}

export function isiOS() {
    return getBrowserInfo().browserOS === 'iOS';
}