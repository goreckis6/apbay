import FilesManager from "./FilesManager";
import { getLogoUrl, listUploadedFiles } from "@/lib/uploads";

export default async function AdminFilesPage() {
  const [files, logoUrl] = await Promise.all([listUploadedFiles(), getLogoUrl()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Files</h1>
      <FilesManager initialFiles={files} initialLogoUrl={logoUrl} />
    </div>
  );
}
