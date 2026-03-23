import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

interface AuthGuardProps {
    children: ReactNode;
    /** App name shown on the login screen. Defaults to "Personal OS" */
    appName?: string;
    /** Description shown below the app name */
    description?: string;
}
declare function AuthGuard({ children, appName, description, }: AuthGuardProps): react_jsx_runtime.JSX.Element;

export { AuthGuard, AuthGuard as default };
