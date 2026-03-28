import { useState } from "react";
import { useAdminGetAnnouncements, useAdminCreateAnnouncement } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function AdminAnnouncements() {
  const { data, refetch } = useAdminGetAnnouncements();
  const { mutate } = useAdminCreateAnnouncement();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "info" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: "Published" });
        setOpen(false);
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Announcements</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2"/> New Post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input placeholder="Title" required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
              <Textarea placeholder="Content..." required value={form.content} onChange={e=>setForm({...form, content:e.target.value})} />
              <Button type="submit" className="w-full">Publish</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {data?.map(a => (
          <div key={a.id} className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-bold text-lg">{a.title}</h3>
            <p className="text-muted-foreground mt-2">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
