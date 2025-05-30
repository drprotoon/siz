import { useToast } from "@/hooks/use-toast";

export default function TestImport() {
  const { toast } = useToast();
  
  return (
    <div>
      <button onClick={() => toast({ title: "Test" })}>Test Toast</button>
    </div>
  );
}
