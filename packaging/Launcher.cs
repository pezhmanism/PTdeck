using System;
using System.Diagnostics;
using System.IO;

internal static class Launcher
{
    private static int Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        try
        {
            using (var host = Process.Start(new ProcessStartInfo
            {
                FileName = Path.Combine(root, "runtime", "node.exe"),
                Arguments = "\"" + Path.Combine(root, "server.cjs") + "\" --open",
                WorkingDirectory = root,
                UseShellExecute = false
            }))
            {
                host.WaitForExit();
                if (host.ExitCode != 0)
                {
                    Console.WriteLine("Press Enter to close.");
                    Console.ReadLine();
                }
                return host.ExitCode;
            }
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            Console.ReadLine();
            return 1;
        }
    }
}

