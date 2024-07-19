class ApiResponse {
    constructor (statusCode, message = 'success', data){
        this.data = data;
        this.message = message; 
        this.statusCode = statusCode; 
        this.success = statusCode < 400;
    }
}



export {ApiResponse};