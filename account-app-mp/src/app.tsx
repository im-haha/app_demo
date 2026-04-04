import {PropsWithChildren} from 'react';
import './app.scss';

function App({children}: PropsWithChildren): React.JSX.Element {
  return <>{children}</>;
}

export default App;
