import { decodeJwt } from "jose";
import Cookies from "js-cookie";

export interface UserData {
    id?: string;
    name?: string;
    avatar?: string;
    seller_profile?: SellerData;
    email?: string;
    role?: string;
    exp?: number;
    iat?: number;
}

interface SellerData {
    uuid?: string;
    name?: string;
}

export const GetUserData = (): UserData => {
    const token = Cookies.get("access_token");

    let user_data: UserData = {};

    if (token) {
        try {
            const decoded = decodeJwt(token);
            user_data = {
                id: decoded.sub || decoded.uuid || decoded.id,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role,
                avatar: decoded.avatar_url,
                seller_profile: decoded.seller_profile,
                exp: decoded.exp,
                iat: decoded.iat
            } as UserData;

            if (user_data.exp && user_data.exp * 1000 < Date.now()) {
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");
                return {};
            }
        } catch (error) {
            console.error("Invalid JWT detected, removing cookies:", error);
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
        }
    } else {
        console.log("GetUserData - No access_token found in cookies");
    }

    return user_data;
};

export const isUserLoggedIn = (): boolean => {
    const token = Cookies.get("access_token");

    if (!token) {
        console.log("isUserLoggedIn - No token found");
        return false;
    }

    try {
        const decoded = decodeJwt(token);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            console.log("JWT token expired");
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            return false;
        }
        return true;
    } catch (error) {
        console.error("Invalid JWT token:", error);
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        return false;
    }
};

export const handleLogout = (): void => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.reload();
};