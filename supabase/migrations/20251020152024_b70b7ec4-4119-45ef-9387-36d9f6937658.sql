-- Allow users to view basic profile info of their referrals
CREATE POLICY "Users can view profiles of their referrals"
ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM referrals 
    WHERE (referrals.referrer_id = auth.uid() AND referrals.referred_id = profiles.id)
    OR (referrals.referred_id = auth.uid() AND referrals.referrer_id = profiles.id)
  )
);