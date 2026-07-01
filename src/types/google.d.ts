/**
 * Tipos mínimos para Google Identity Services (GIS), cargado por script externo
 * (`https://accounts.google.com/gsi/client`). No hay paquete npm: declaramos el
 * global `google` como `any` para consumirlo sin fricción desde `Login`.
 */
declare const google: any;

interface Window {
  google?: any;
}
