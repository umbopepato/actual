import { View } from '../common/View';
import { LoadComponent } from '../util/LoadComponent';

export function DashboardRouterLazy() {
  return (
    <View style={{ flex: 1 }} data-testid="reports-page">
      <LoadComponent
        name="ReportRouter"
        message="Loading dashboard..."
        importer={() =>
          import(/* webpackChunkName: 'reports' */ './DashboardRouter')
        }
      />
    </View>
  );
}
