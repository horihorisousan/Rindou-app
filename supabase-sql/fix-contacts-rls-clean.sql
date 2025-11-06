DROP POLICY IF EXISTS "Anyone can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Enable insert for all users" ON contacts;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON contacts;

CREATE POLICY "Enable insert for all users"
  ON contacts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable read for users based on user_id"
  ON contacts
  FOR SELECT
  USING (auth.uid() = user_id);
