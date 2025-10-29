-- Manual update script for branch serial numbers
-- This script maps branch_number to serial_number for WordPress integration

UPDATE public.branches SET serial_number = '617' WHERE branch_number = '1';
UPDATE public.branches SET serial_number = '627' WHERE branch_number = '11';
UPDATE public.branches SET serial_number = '618' WHERE branch_number = '15';
UPDATE public.branches SET serial_number = '679' WHERE branch_number = '16';
UPDATE public.branches SET serial_number = '681' WHERE branch_number = '18';
UPDATE public.branches SET serial_number = '630' WHERE branch_number = '20';
UPDATE public.branches SET serial_number = '619' WHERE branch_number = '26';
UPDATE public.branches SET serial_number = '620' WHERE branch_number = '30';
UPDATE public.branches SET serial_number = '638' WHERE branch_number = '35';
UPDATE public.branches SET serial_number = '645' WHERE branch_number = '36';
UPDATE public.branches SET serial_number = '621' WHERE branch_number = '40';
UPDATE public.branches SET serial_number = '639' WHERE branch_number = '41';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '44';
UPDATE public.branches SET serial_number = '4523' WHERE branch_number = '45';
UPDATE public.branches SET serial_number = '622' WHERE branch_number = '50';
UPDATE public.branches SET serial_number = '623' WHERE branch_number = '51';
UPDATE public.branches SET serial_number = '639' WHERE branch_number = '52';
UPDATE public.branches SET serial_number = '631' WHERE branch_number = '54';
UPDATE public.branches SET serial_number = '4425' WHERE branch_number = '55';
UPDATE public.branches SET serial_number = '632' WHERE branch_number = '60';
UPDATE public.branches SET serial_number = '633' WHERE branch_number = '65';
UPDATE public.branches SET serial_number = '641' WHERE branch_number = '66';
UPDATE public.branches SET serial_number = '647' WHERE branch_number = '71';
UPDATE public.branches SET serial_number = '634' WHERE branch_number = '72';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '75';
UPDATE public.branches SET serial_number = '642' WHERE branch_number = '76';
UPDATE public.branches SET serial_number = '643' WHERE branch_number = '77';
UPDATE public.branches SET serial_number = '636' WHERE branch_number = '78';
UPDATE public.branches SET serial_number = '680' WHERE branch_number = '80';
UPDATE public.branches SET serial_number = '625' WHERE branch_number = '81';
UPDATE public.branches SET serial_number = '626' WHERE branch_number = '82';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '83';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '91';
UPDATE public.branches SET serial_number = '637' WHERE branch_number = '98';
UPDATE public.branches SET serial_number = '628' WHERE branch_number = '202';
UPDATE public.branches SET serial_number = '667' WHERE branch_number = '203';
UPDATE public.branches SET serial_number = '668' WHERE branch_number = '205';
UPDATE public.branches SET serial_number = '669' WHERE branch_number = '207';
UPDATE public.branches SET serial_number = '657' WHERE branch_number = '211';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '212';
UPDATE public.branches SET serial_number = '672' WHERE branch_number = '217';
UPDATE public.branches SET serial_number = '673' WHERE branch_number = '218';
UPDATE public.branches SET serial_number = '674' WHERE branch_number = '220';
UPDATE public.branches SET serial_number = '675' WHERE branch_number = '222';
UPDATE public.branches SET serial_number = '676' WHERE branch_number = '223';
UPDATE public.branches SET serial_number = '677' WHERE branch_number = '230';
UPDATE public.branches SET serial_number = '658' WHERE branch_number = '238';
UPDATE public.branches SET serial_number = '648' WHERE branch_number = '239';
UPDATE public.branches SET serial_number = '644' WHERE branch_number = '241';
UPDATE public.branches SET serial_number = '678' WHERE branch_number = '242';
UPDATE public.branches SET serial_number = '659' WHERE branch_number = '244';
UPDATE public.branches SET serial_number = '660' WHERE branch_number = '245';
UPDATE public.branches SET serial_number = '661' WHERE branch_number = '246';
UPDATE public.branches SET serial_number = '649' WHERE branch_number = '247';
UPDATE public.branches SET serial_number = '650' WHERE branch_number = '250';
UPDATE public.branches SET serial_number = '645' WHERE branch_number = '260';
UPDATE public.branches SET serial_number = '662' WHERE branch_number = '261';
UPDATE public.branches SET serial_number = '663' WHERE branch_number = '262';
UPDATE public.branches SET serial_number = '654' WHERE branch_number = '263';
UPDATE public.branches SET serial_number = '652' WHERE branch_number = '264';
UPDATE public.branches SET serial_number = '653' WHERE branch_number = '265';
UPDATE public.branches SET serial_number = '664' WHERE branch_number = '267';
UPDATE public.branches SET serial_number = '665' WHERE branch_number = '268';
UPDATE public.branches SET serial_number = '646' WHERE branch_number = '274';
UPDATE public.branches SET serial_number = '629' WHERE branch_number = '277';
UPDATE public.branches SET serial_number = '666' WHERE branch_number = '289';
UPDATE public.branches SET serial_number = '656' WHERE branch_number = '290';
UPDATE public.branches SET serial_number = '0' WHERE branch_number = '265';

-- Verify the updates
SELECT branch_name, branch_number, serial_number 
FROM public.branches 
ORDER BY branch_number;
