import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://final-project-w891.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;

