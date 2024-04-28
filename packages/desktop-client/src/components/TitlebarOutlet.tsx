import { type PropsWithChildren, useRef } from 'react';
import { createPortal } from 'react-dom';

export const TitlebarOutlet = ({ children }: PropsWithChildren) => {
  const outletDomNode = useRef(document.querySelector('#titlebar-outlet'));

  return createPortal(children, outletDomNode.current);
};
