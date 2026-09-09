export const msalConfig = {
    auth: {
        clientId: "7c1a6d1e-d4ff-416b-8815-e7e65d5ca80a",
        authority: "https://login.microsoftonline.com/d77d868f-74db-4ba9-8880-280127dd4ec2",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false, // Set to true for IE 11 or Edge
    },
    system: { 
        allowNativeBroker: false, // Set to true if you want to use the native broker (e.g., for Windows Hello)
    },
};

export const loginRequest = {
    scopes: ["api://7c1a6d1e-d4ff-416b-8815-e7e65d5ca80a/access_as_user"],
    prompt: "select_account",
};
