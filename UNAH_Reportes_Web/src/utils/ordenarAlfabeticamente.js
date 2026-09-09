const comparadorEspanol = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});

export function ordenarAlfabeticamente(elementos, selector = (elemento) => elemento) {
  return [...elementos].sort((primero, segundo) => comparadorEspanol.compare(selector(primero), selector(segundo)));
}
