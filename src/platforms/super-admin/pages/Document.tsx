import DocumentShell from '../../../components/DocumentShell';
import type { DocumentData } from '../../../contexts/DocumentContext';
import data from '../../../mock-data/documents/super-admin.json';

export default function SuperAdminDocument() {
  return <DocumentShell data={data as unknown as DocumentData} />;
}
