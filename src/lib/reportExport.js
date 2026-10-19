import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportReportCsv(csv, filename) {
  const file = new File(Paths.cache, filename);
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export performance report',
  });
}
