// Click outside directive for Svelte
// Usage: <div use:clickOutside={() => showDropdown = false}>...</div>

export function clickOutside(node: HTMLElement, handler: () => void) {
  const handleClick = (event: MouseEvent) => {
    if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
      handler();
    }
  };
  
  document.addEventListener('click', handleClick, true);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
} 