/**
 * Define quem é considerado jovem na ICFR Família Redimida.
 *
 * A condição de jovem é calculada automaticamente através
 * da data de nascimento do membro.
 *
 * Não existe um campo específico "é jovem" no cadastro
 * nem uma coleção separada no Firestore.
 *
 * O sistema verifica a idade do membro e determina
 * se ele pertence ou não ao grupo de jovens.
 */

import type { Member } from '~/types'

/**
 * Faixa etária considerada como juventude na ICFR.
 */
export const YOUTH_MIN_AGE = 13
export const YOUTH_MAX_AGE = 35

/**
 * Calcula a idade aproximada do membro em anos.
 *
 * Esta lógica usa apenas a diferença entre os anos.
 * Foi mantida para não alterar o comportamento atual
 * do sistema em relação aos membros já registados.
 */
function ageInYears(
  dob: string,
  now: Date
): number {
  return (
    now.getFullYear() -
    new Date(dob).getFullYear()
  )
}

/**
 * Verifica se um membro pertence à faixa etária
 * dos jovens da ICFR Família Redimida.
 *
 * Se o membro não tiver data de nascimento registada,
 * o sistema não assume automaticamente que ele é jovem.
 */
export function isYouth(
  member: Pick<Member, 'dob'>,
  now: Date = new Date()
): boolean {
  if (!member.dob) return false

  const age = ageInYears(
    member.dob,
    now
  )

  return (
    age >= YOUTH_MIN_AGE &&
    age <= YOUTH_MAX_AGE
  )
}

/**
 * Verifica se existem informações escolares
 * ou académicas registadas para o membro.
 *
 * Estes dados continuam disponíveis mesmo
 * quando o membro ultrapassa a idade máxima
 * definida para o grupo de jovens.
 *
 * Isso evita que informações já registadas
 * desapareçam do perfil do membro.
 */
export function hasSchoolingDetails(
  member: Member
): boolean {
  return Boolean(
    member.school ||
    member.department ||
    member.courseOfStudy ||
    member.program ||
    member.level ||
    member.hallOfResidence ||
    member.yearOfEntry ||
    member.yearOfExit ||
    member.comment
  )
}