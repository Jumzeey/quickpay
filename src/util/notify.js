import { toast } from 'sonner';

export default class Notify {
    static error(message, title = "Error") {
        toast.error(message, title);
    }
    static success(message, title = "Success") {
        toast.success(message, title);
    }
    static warning(message, title = "Warning") {
        toast.warning(message, title);
    }
    static info(message, title = "Information") {
        toast.info(message, title);
    }

}