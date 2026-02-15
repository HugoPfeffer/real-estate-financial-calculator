import Root from './alert.svelte';
import Title from './alert-title.svelte';
import Description from './alert-description.svelte';

export type AlertVariant = 'default' | 'destructive' | 'warning';

export { Root, Title, Description, Root as Alert };
