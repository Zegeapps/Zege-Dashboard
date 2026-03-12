import axios from 'axios';

const API_URL = '/api/files';

const fileService = {
    getFiles: async (path = '/') => {
        const response = await axios.get(`${API_URL}?path=${encodeURIComponent(path)}`);
        return response.data;
    },

    createFolder: async (folderData) => {
        const response = await axios.post(API_URL, {
            ...folderData,
            isFolder: true,
            type: 'folder'
        });
        return response.data;
    },

    uploadFileMetadata: async (fileData) => {
        const response = await axios.post(API_URL, fileData);
        return response.data;
    },

    renameFile: async (id, showcaseName) => {
        const response = await axios.put(`${API_URL}?id=${id}`, { showcaseName });
        return response.data;
    },

    deleteFile: async (id) => {
        const response = await axios.delete(`${API_URL}?id=${id}`);
        return response.data;
    }
};

export default fileService;
