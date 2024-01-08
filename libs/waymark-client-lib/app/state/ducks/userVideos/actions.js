// Local
import {
    USER_VIDEO_ADD,
    USER_VIDEO_FETCH_COMPLETE,
    USER_VIDEO_FETCH_ERROR,
    USER_VIDEO_FETCH_PENDING,
    USER_VIDEO_FETCH_ALL_COMPLETE,
    USER_VIDEO_FETCH_ALL_ERROR,
    USER_VIDEO_FETCH_ALL_PENDING,
    USER_VIDEO_UPDATE,
} from '../../actionTypes.js';

const addUserVideo = (userVideo) => ({
    type: USER_VIDEO_ADD,
    payload: userVideo,
});

const updateUserVideo = (userVideo) => ({
    type: USER_VIDEO_UPDATE,
    payload: userVideo,
});

const fetchingUserVideo = (guid) => ({
    type: USER_VIDEO_FETCH_PENDING,
    payload: guid,
});

const receivedUserVideo = (userVideo) => ({
    type: USER_VIDEO_FETCH_COMPLETE,
    payload: userVideo,
});

const failedUserVideoFetch = (error, guid) => ({
    type: USER_VIDEO_FETCH_ERROR,
    payload: {
        error,
        guid
    },
});

const fetchingAllUserVideos = () => ({
    type: USER_VIDEO_FETCH_ALL_PENDING,
});

const receivedAllUserVideos = (userVideos) => ({
    type: USER_VIDEO_FETCH_ALL_COMPLETE,
    payload: userVideos,
});

const failedAllUserVideosFetch = (error) => ({
    type: USER_VIDEO_FETCH_ALL_ERROR,
    payload: {
        error
    },
});

export default {
    addUserVideo,
    failedUserVideoFetch,
    fetchingUserVideo,
    receivedUserVideo,
    failedAllUserVideosFetch,
    fetchingAllUserVideos,
    receivedAllUserVideos,
    updateUserVideo,
};