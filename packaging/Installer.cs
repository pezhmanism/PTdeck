using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;

internal static class Installer
{
    [STAThread]
    private static int Main()
    {
        string root = Path.Combine(Environment.GetEnvironmentVariable("LOCALAPPDATA"), "PTdeck");
        string staging = root + ".setup-" + Guid.NewGuid().ToString("N");
        try
        {
            if (MessageBox.Show("Install PTdeck for your Windows account?", "PTdeck Setup",
                MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return 0;
            Directory.CreateDirectory(staging);
            using (Stream payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("PTdeckPayload"))
            using (var archive = new ZipArchive(payload, ZipArchiveMode.Read))
            {
                archive.ExtractToDirectory(staging);
            }
            Directory.CreateDirectory(root);
            foreach (string source in Directory.GetFiles(staging, "*", SearchOption.AllDirectories))
            {
                string destination = Path.Combine(root, source.Substring(staging.Length + 1));
                Directory.CreateDirectory(Path.GetDirectoryName(destination));
                File.Copy(source, destination, true);
            }
            string exe = Path.Combine(root, "PTdeck.exe");
            string programs = Path.Combine(Environment.GetEnvironmentVariable("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs");
            Directory.CreateDirectory(programs);
            dynamic shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
            dynamic shortcut = shell.CreateShortcut(Path.Combine(programs, "PTdeck.lnk"));
            shortcut.TargetPath = exe;
            shortcut.WorkingDirectory = root;
            shortcut.Save();
            Process.Start(new ProcessStartInfo(exe) { WorkingDirectory = root, UseShellExecute = true });
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message + "\n\nClose any running PTdeck instance before retrying.",
                "PTdeck Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        finally
        {
            try { if (Directory.Exists(staging)) Directory.Delete(staging, true); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }
}

