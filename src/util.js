import jwt from 'jwt-decode';
export class UserManager {
    constructor(token) {
        this.asign(token)
    }

    asign(token) {
        if (token != null) {
            let obj = jwt(token);
    
            this.name = obj.name;
            this.nameid = obj.nameid;
            this.userName = obj.unique_name;
            this.role = [];
            
            if (typeof obj.role == 'string') {
                this.role.push(obj.role)
            } else if (typeof obj.role == 'object') {
                this.role = obj.role
            }
        } else {
            this.name = "";
            this.nameid = "";
            this.userName = "";
            this.role = [];
        }
    }

    is(roleName) {
        return this.role.some(x => x == roleName);
    }
    isAny(roles) {
        let result = false;
        for (const i of roles) {
            if (this.is(i)) {
                result = true;
                break;
            }
        }

        return result;
    }
}