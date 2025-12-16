import { toast } from "@/components/ui/use-toast";

export default class Notify {
  static error(message, title = "Error") {
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  }
  static success(message, title = "Success") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }
  static warning(message, title = "Warning") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }
  static info(message, title = "Information") {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }
}
