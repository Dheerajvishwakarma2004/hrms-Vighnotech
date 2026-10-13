import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

/** Title of the deepest matched route (`handle.title`); also syncs `document.title`. */
export function useRouteTitle() {
  const matches = useMatches();
  const title = [...matches].reverse().find((match) => match.handle?.title)?.handle.title ?? '';

  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} | VighnoTech`;
  }, [title]);

  return title;
}
