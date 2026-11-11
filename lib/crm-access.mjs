// Acesso ao CRM é concedido exclusivamente por membership ativa no banco.
export async function checkCrmAccess(db,user) {
 if(!user?.id||!user?.email||!db?.from)return false;
 try{
  const {data,error}=await db.from('crm_memberships')
   .select('enabled,role')
   .eq('user_id',user.id)
   .eq('enabled',true)
   .maybeSingle();
  return !error&&data?.enabled===true&&['admin','operator'].includes(data.role);
 }catch{return false}
}
