import useAuthentication from "@/stores/useAuthentication";
import eventEmitter from "@/util/eventEmitter";

export default function logout() {
    eventEmitter.emit("logout");
    useAuthentication.setState((state) => ({
        ...state,
        accessToken: null,
        user: null
    }));
    
}