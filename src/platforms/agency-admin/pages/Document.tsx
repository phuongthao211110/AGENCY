import DocumentShell from '../../../components/DocumentShell';
import type { DocumentData } from '../../../contexts/DocumentContext';
import data from '../../../mock-data/documents/agency-admin.json';

export default function AgencyAdminDocument() {
  return <DocumentShell data={data as unknown as DocumentData} />;
}
