export function sportLabel(value: string) {
  const labels: Record<string,string> = { strength_training:'Fuerza',strengthtraining:'Fuerza',walking:'Caminata',running:'Carrera',cycling:'Ciclismo',swimming:'Natación',hiking:'Senderismo',yoga:'Yoga',hiit:'HIIT',cardio_training:'Cardio',other:'Actividad' };
  return labels[value.toLowerCase()] ?? value.replaceAll('_',' ');
}
