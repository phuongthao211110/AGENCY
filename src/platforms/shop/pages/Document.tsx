import DocumentShell from '../../../components/DocumentShell';
import type { DocumentData } from '../../../contexts/DocumentContext';
import data from '../../../mock-data/documents/shop.json';

export default function ShopDocument() {
  return <DocumentShell data={data as unknown as DocumentData} />;
}
